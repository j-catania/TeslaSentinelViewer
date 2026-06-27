import Clip from '@/components/Clip';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {useEffect, useState} from 'react';
import {Event} from "@/types";

interface IClips {
    path: string,
    onSelection?: (event?: Event) => void,
}

const Clips = ({path, onSelection}: IClips) => {
    const [dirs, setDirs] = useState<string[]>();
    const [dirsSize, setDirsSize] = useState<number>();
    const [deleted, setDeleted] = useState<string>();
    const [activeClip, setActiveClip] = useState<string>();
    const [selectedClips, setSelectedClips] = useState<string[]>([]);
    const [openDeletion, setOpenDeletion] = useState(false);
    const [page, setPage] = useState(0);

    const ITEM_PER_PAGE = 6;

    useEffect(() => {
        updateFiles();
    }, [path, deleted, page]);

    const updateFiles = () => {
        // @ts-ignore
        window.sentinel.getFiles(path).then(lst => {
            setDirs(lst.slice(page * ITEM_PER_PAGE, page * ITEM_PER_PAGE + ITEM_PER_PAGE));
            setDirsSize(lst.length);
        });
    }


    return <Stack spacing={1} alignItems="flex-start">
        <Stack direction="row">
            <Badge badgeContent={selectedClips.length} color="primary">
                <IconButton
                    onClick={_ => {
                        setOpenDeletion(true)
                    }}
                    disabled={selectedClips.length === 0}>
                    <DeleteIcon/>
                </IconButton>
            </Badge>
            <Stack direction="column">
                <Box sx={{display: "flex", gap: 1}}>
                    <IconButton
                        size="small"
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                        sx={{bgcolor: "background.paper"}}
                    >
                        <KeyboardArrowLeftIcon/>
                    </IconButton>
                    <IconButton
                        size="small"
                        disabled={
                            dirsSize !== -1
                                ? page >= Math.ceil((dirsSize ?? 0) / ITEM_PER_PAGE) - 1
                                : false
                        }
                        onClick={() => setPage(page + 1)}
                        sx={{bgcolor: "background.paper"}}
                    >
                        <KeyboardArrowRightIcon/>
                    </IconButton>
                </Box>
            </Stack>
        </Stack>

        <Grid container spacing={1} justifyContent="center">
            {dirs?.map(item =>
                <Grid item key={item}>
                    <Clip path={item}
                          active={activeClip === item}
                          onSelection={(event?: Event) => {
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
                          onDeletion={setDeleted}/>
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
                <WarningRoundedIcon/>
                Confirmation
            </DialogTitle>
            <Divider/>
            <DialogContent>
                <DialogContentText id="alert-dialog-modal-description">
                    Êtes vous sûr de vouloir supprimer {selectedClips.length} clips ?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button variant="text" color="inherit" onClick={(e) => {
                    e.stopPropagation();
                    setOpenDeletion(false);
                }}>
                    Annuler
                </Button>
                <Button variant="contained" color="error" onClick={(e) => {
                    e.stopPropagation();
                    const deletingProm = selectedClips.map(path => {
                        // @ts-ignore
                        return window.sentinel.remove(path)
                    });

                    Promise.all(deletingProm).then(_ => {
                        setSelectedClips([]);
                        updateFiles();
                    })
                    setOpenDeletion(false);
                }}>
                    Supprimer
                </Button>
            </DialogActions>
        </Dialog>
    </Stack>
}

export default Clips
