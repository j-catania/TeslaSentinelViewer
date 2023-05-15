import Clip from '@/components/Clip';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {Badge, Box, Button, Divider, Grid, Modal, ModalDialog, Stack, Typography} from '@mui/joy';
import IconButton from '@mui/joy/IconButton';
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
            <Badge badgeContent={selectedClips.length}>
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
                        size="sm"
                        color="neutral"
                        variant="outlined"
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                        sx={{bgcolor: "background.surface"}}
                    >
                        <KeyboardArrowLeftIcon/>
                    </IconButton>
                    <IconButton
                        size="sm"
                        color="neutral"
                        variant="outlined"
                        disabled={
                            dirsSize !== -1
                                ? page >= Math.ceil((dirsSize ?? 0) / ITEM_PER_PAGE) - 1
                                : false
                        }
                        onClick={() => setPage(page + 1)}
                        sx={{bgcolor: "background.surface"}}
                    >
                        <KeyboardArrowRightIcon/>
                    </IconButton>
                </Box>
            </Stack>
        </Stack>

        <Grid container spacing={1} justifyContent="center">
            {dirs?.map(item =>
                <Grid key={item}>
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
        <Modal open={openDeletion}
               onClose={() => setOpenDeletion(false)}>
            <ModalDialog
                variant="outlined"
                role="alertdialog"
                aria-labelledby="alert-dialog-modal-title"
                aria-describedby="alert-dialog-modal-description"
            >
                <Typography
                    id="alert-dialog-modal-title"
                    component="h2"
                    startDecorator={<WarningRoundedIcon/>}
                >
                    Confirmation
                </Typography>
                <Divider/>
                <Typography id="alert-dialog-modal-description" textColor="text.tertiary">
                    Êtes vous sûr de vouloir supprimer {selectedClips.length} clips ?
                </Typography>
                <Box sx={{display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 2}}>
                    <Button variant="plain" color="neutral" onClick={(e) => {
                        e.stopPropagation();
                        setOpenDeletion(false);
                    }}>
                        Annuler
                    </Button>
                    <Button variant="solid" color="danger" onClick={(e) => {
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
                </Box>
            </ModalDialog>
        </Modal>
    </Stack>
}

export default Clips
