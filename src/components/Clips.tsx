import Clip from '@/components/Clip';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Event } from "@/types";

interface IClips {
    path: string,
    onSelection?: (event?: Event) => void,
}

const Clips = ({ path, onSelection }: IClips) => {
    const [allDirs, setAllDirs] = useState<string[]>([]);
    const [dirs, setDirs] = useState<string[]>([]);
    const [activeClip, setActiveClip] = useState<string>();
    const [selectedClips, setSelectedClips] = useState<string[]>([]);
    const [openDeletion, setOpenDeletion] = useState(false);
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    const PAGE_SIZE_OPTIONS = [1, 3, 6, 12, 24];

    // Fetch the full clip list once per path; reset page to avoid stale position
    useEffect(() => {
        setPage(0);
        window.sentinel.getFiles(path).then(setAllDirs);
    }, [path]);

    // Derive the visible page slice without re-fetching from disk
    useEffect(() => {
        setDirs(allDirs.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage));
    }, [allDirs, page, itemsPerPage]);


    return <Stack spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
        <Stack direction="row" alignItems="center" sx={{ width: '100%' }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Pagination
                    count={Math.max(1, Math.ceil(allDirs.length / itemsPerPage))}
                    page={page + 1}
                    onChange={(_, value) => setPage(value - 1)}
                    size="small"
                    siblingCount={1}
                    boundaryCount={0}
                    showFirstButton
                    showLastButton
                />
                <FormControl size="small">
                    <Select
                        value={itemsPerPage}
                        onChange={(e: SelectChangeEvent<number>) => {
                            setPage(0);
                            setItemsPerPage(e.target.value as number);
                        }}
                    >
                        {PAGE_SIZE_OPTIONS.map(n => (
                            <MenuItem key={n} value={n}>{n} / page</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <Badge badgeContent={selectedClips.length} color="primary" sx={{ ml: 'auto' }}>
                <IconButton
                    onClick={_ => setOpenDeletion(true)}
                    disabled={selectedClips.length === 0}>
                    <DeleteIcon />
                </IconButton>
            </Badge>
        </Stack>

        <Grid container spacing={1}>
            {dirs?.map(item =>
                <Grid item key={item}>
                    <Clip path={item}
                        active={activeClip === item}
                        selected={selectedClips.includes(item)}
                        onClick={(event?: Event) => {
                            onSelection?.(event)
                            setActiveClip(event?.root)
                        }}
                        onSelectionChange={(seleted: boolean) => {
                            if (seleted) {
                                setSelectedClips(prevState => [...prevState, item]);
                            } else {
                                setSelectedClips(prevState => prevState.filter(path => path !== item));
                            }
                        }}
                        onDeletion={(deletedPath: string) => {
                            setAllDirs(prev => prev.filter(d => d !== deletedPath));
                        }} />
                </Grid>
            )}
        </Grid>
        <Dialog
            open={openDeletion}
            onClose={() => setOpenDeletion(false)}
            aria-labelledby="alert-dialog-modal-title"
            aria-describedby="alert-dialog-modal-description"
        >
            <DialogTitle id="alert-dialog-modal-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningRoundedIcon />
                Confirmation
            </DialogTitle>
            <Divider />
            <DialogContent>
                <DialogContentText id="alert-dialog-modal-description">
                    Are you sure you want to delete {selectedClips.length} clip(s)?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button variant="text" color="inherit" onClick={(e) => {
                    e.stopPropagation();
                    setOpenDeletion(false);
                }}>
                    Cancel
                </Button>
                <Button variant="contained" color="error" onClick={(e) => {
                    e.stopPropagation();
                    const deletingProm = selectedClips.map(path => {
                        return window.sentinel.remove(path);
                    });

                    Promise.all(deletingProm).then(() => {
                        const toDelete = new Set(selectedClips);
                        setAllDirs(prev => prev.filter(d => !toDelete.has(d)));
                        setSelectedClips([]);
                    })
                    setOpenDeletion(false);
                }}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    </Stack>
}

export default Clips
